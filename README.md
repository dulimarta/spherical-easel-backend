# Launching the backend server

## Option 1

Inspect the file `nodemon.json` to confirm that it is configured to run the correct file. Then type the following command from the project root directory.

```bash
npx nodemon
```

## Option 2

Build a docker image by typing the following from the project root directory:

```bash
docker build -t se-backend .
```

To see the details of the Docker image type the following command (requires [Docker desktop](https://www.docker.com/get-started/) installed on your computer):

```bash
docker image ls
```

Then launch a container from the image just built:

```bash
docker run -it -p 4444:4000 --rm --name se-backend-server se-backend
```

In the above command:


* The container (internal) port 4000 is mapped to the host (your local computer) port 4444
* `se-backend` is the name of the image
* `se-backend-server` is the name of the container. Without the `--name se-backend-server` option, Docker will generate a unique name for the container.

To verify the backend server is running, type the following URL on your browser:

```
localhost:4444/geo/sessions
```

It should print "No active sessions detected"

To stop the running container you can either press Ctrl-C or type the following command:

```bash
docker stop se-backend-server
```
## Deployment to Heroku

1. Download [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#install-the-heroku-cli)
2. Login to Heroku

   ```bash
   heroku login
   ```

3. Create a new Heroku app (if you don't have one yet)

   ```bash
   heroku create  # only if you don't have one yet
   heroku stack:set container
   ```

   You will see two URLs:
   * The Git repo on Heroku: `https://git.heroku.com/<THE_APP_NAME>.git`
   * The production URL: `https://<THE_APP_NAME>.herokuapp.com`

4. Build and deploy to Heroku by using one of the following options:

   - Use the build instruction in `heroku.yml`
  
      ```
      # Assuming "heroku" is associated with Heroku Git repo above
      git push heroku
      ```

   - Manually push to Heroku registry
  
      ```
      heroku git:remote -a <THE_APP_NAME>
      heroku container:login
      heroku container:push -a <THE_APP_NAME>
      heroku container:release -a <THE_APP_NAME>
      ```

5. Confirm on your Heroku app dashbard (under the "Overview tab") that you have a web dyno enabled

6. Verify your Heroku deployment by typing the following URL from a browser: `https://<THE_APP_NAME>.herokuapp.com/geo/sessions` and expect to see "No active sessions detected"
