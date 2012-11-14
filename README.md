pnl
===
to push to production:

    CUR_ENV=stg; git push $CUR_ENV master; ssh ${CUR_ENV}@184.169.164.71 "cd pnl; git pull origin master; cd pnltracker-expjs; npm install; NODE_ENV=$CUR_ENV forever start app.js"
