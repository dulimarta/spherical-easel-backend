# Launching the backend server

## Option 1

Inspect the file `nodemon.json` to confirm that it is configured to run the correct file. Then type the following command from the project root directory.

```bash
npx nodemon
```

## Option 2

Build a docker image by typing the following from the project root directory:

```bash
docker build -t DDDDDDDD/easelgeo-session .
```

To see the details of the Docker image type the following command (requires [Docker desktop](https://www.docker.com/get-started/) installed on your computer):

```bash
docker image ls
```

Then launch a container from the image just built:

```bash
docker run -it -p 4444:4000 --rm DDDDDDDD/easelgeo-session
```

In the above command:

* The option `-i` (or `--interactive`) keeps the STDIN open
* The option `-t` (or `--tty`) allocates a pseudo terminal
* The container (internal) port 4000 is mapped to the host (your local computer) port 4444
* The 
* `easelgeo-session` is the name of the image (pulled from its owner DDDDDDDD)

To verify the backend server is running, type the following URL on your browser:

```
localhost:4444/sessions
```

It should print "No active sessions detected"

## Terminate the backend server

To stop the running container you can either press Ctrl-C or 

* List all the running containers on your machine

  ```bash
  docker ps
  ```

  Search for `easeogeo-session` under the `IMAGE` column and look for the associated
  container id

* Stop the container by 

  ```
  docker stop _the_container_id_
  ```


docker stop se-backend-server
```
## Deployment to Heroku (Obsolete)

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
