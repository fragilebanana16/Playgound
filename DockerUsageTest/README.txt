#### minimal demo
1. write docker file

2. build docker images
> docker build -t hello-docker .

3. check for images
> docker images

4. run
> docker run hello-docker

5. access directly from cmd line
> docker run -it hello-docker sh
> node hello.js

#### build - run with single dockerfile
web_home_manager-client(port 3000)
1. build
> docker build -t web_home_manager-client .

2. with port mapping with container(package.json set script --host)
> docker run -p 3000:3000 web_home_manager-client

3. list all containers
> docker ps -a

4. mount current cmd path to app in the container(reflect change to container without rebuild)
> docker run -p 3000:3000 -v "%cd%":/app -v /app/node_modules web_home_manager-client

[not changing ]

5. publish
> docker login
> docker tag hello-docker username/hello-docker
> docker push username/hello-docker

#### test volume change with hello.js
docker run -v "%cd%":/app hello-docker

#### compose:
1. init
> docker init

2. compose 
> docker compose up

compose.yaml can configure web, api together
check change do sync or rebuild
> docker compose watch