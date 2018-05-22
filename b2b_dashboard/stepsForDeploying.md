# Steps for deploying dashboard to Heroku

## Directory structure:
```
├── .git  
├── b2b_dashboard  
│   ├── Procfile
│   ├── node_modules  
│   ├── nodeserver.js  
│   ├── package-lock.json  
│   ├── package.json  
│   └── public
├── other dirs...
```

Since the dashboard is embedded in a larger `git` repository, you can't follow the typical heroku instructions. Instead you have to push the b2b_dashboard to heroku as a *subtree*

## Steps

### Make sure your package.json file is correct

Your `package.json` file needs to contain the following start script lines to make sure your app will start up when deployed:

```
  "scripts": {
    "start": "node nodeserver.js"
  }
```

change `nodeserver.js` to whatever the name of your server is. 

### Create heroku app

>heroku create

This will create an app on heroku and generate a random name for it, like 

`https://warm-river-88108.herokuapp.com/` 

as well as a git repository at:

`https://git.heroku.com/warm-river-88108.git`

You now have a `git remote` set up named `heroku` that links to that git repository.

### Push changes to subtree
Any time you make changes to your node app and want to re-deploy, you must follow the typical git steps of add and commit:

> git add *
> git commit -m "blah blah blah"

Then, you must push your subtree to the remote heroku repo:

> git subtree push --prefix b2b_dashboard heroku master

where `b2b_dashboard` is the directory containing your node app

## Add'l heroku commands:

* 	`heroku create`: create an app on heroku
*	`heroku ps:scale web=1`: start a web dyno
*	`heroku open`: open the site in default webbrowser
*	`heroku logs --tail`: show end of logs
*	`heroku ps`: check how many dynos are running  
