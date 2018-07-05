const fs = require('fs');

const subcommand = 'enable';
const category = 'auth';
let options;

module.exports = {
  name: subcommand,
  run: async (context) => {

    const { amplify } = context;
    const configure = context.parameters.options.configure ? '-configure' : '';
    const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-services${configure}.json`));

    const existingAuth = amplify.getProjectDetails().amplifyMeta.auth || {}

    if (Object.keys(existingAuth).length > 0){
      return context.print.warning('Auth has already been "enabled" for this project.')
    }
    
    return amplify.serviceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
        };
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }
        return providerController.addResource(context, category, result.service, configure);
      })
      .then((resourceName) => {
        amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);
      })
      .then(() => context.print.success('Successfully added resource'))
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the auth resource');
      });
  },
};
