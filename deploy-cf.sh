#!/bin/bash

# Push the app in LiveEdit mode
function cf_push {
    # Required for LiveEdit
    touch .live-edit
    
    # Push the app
    cf push $1 -c null --no-start

    echo "Setting credentials ..."

    cf set-env $CF_APP TONE_ANALYZER_IAM_APIKEY $TONE_ANALYZER_IAM_APIKEY > /dev/null
    cf set-env $CF_APP TONE_ANALYZER_URL $TONE_ANALYZER_URL > /dev/null

    cf set-env $CF_APP TWITTER_CONSUMER_KEY $TWITTER_CONSUMER_KEY > /dev/null
    cf set-env $CF_APP TWITTER_CONSUMER_SECRET $TWITTER_CONSUMER_SECRET > /dev/null
    cf set-env $CF_APP TWITTER_ACCESS_TOKEN_KEY $TWITTER_ACCESS_TOKEN_KEY > /dev/null
    cf set-env $CF_APP TWITTER_ACCESS_TOKEN_SECRET $TWITTER_ACCESS_TOKEN_SECRET > /dev/null

    echo "Setting enviroment variables ..."
    
    # Required for LivEdit
    cf set-env $1 BLUEMIX_APP_MGMT_ENABLE devconsole+shell+inspector
    cf set-env $1 NODE_ENV development
    
    # Start the app
    cf restart $1
}

# Push app
if ! cf app $CF_APP; then  
  cf_push $CF_APP
else
  OLD_CF_APP=${CF_APP}-OLD-$(date +"%s")
  rollback() {
    set +e  
    if cf app $OLD_CF_APP; then
      cf logs $CF_APP --recent
      cf delete $CF_APP -f
      cf rename $OLD_CF_APP $CF_APP
    fi
    exit 1
  }
  set -e
  trap rollback ERR
  cf rename $CF_APP $OLD_CF_APP
  cf_push $CF_APP
  cf delete $OLD_CF_APP -f
fi

# Export app name and URL for use in later Pipeline jobs
export CF_APP_NAME="$CF_APP"
export APP_URL=http://$(cf app $CF_APP_NAME | grep urls: | awk '{print $2}')

# View logs
#cf logs "${CF_APP}" --recent

exit
