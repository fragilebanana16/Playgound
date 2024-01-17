#### [√]minimal demo
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

#### [×]build - run with single dockerfile
web_home_manager-client(port 3000)
1. build
> docker build -t web_home_manager-client .

2. with port mapping with container(package.json set script --host)
> docker run -p 3000:3000 web_home_manager-client

3. list all containers
> docker ps -a

4. mount current cmd path to app in the container(reflect change to container without rebuild)
> docker run -p 3000:3000 -v "%cd%":/app -v /app/node_modules web_home_manager-client

[×]reason:
[not changing or resync file change ]
might be not excuting the watch command

5. [not tested]publish
> docker login
> docker tag hello-docker username/hello-docker
> docker push username/hello-docker

#### test volume change with hello.js
docker run -v "%cd%":/app hello-docker

#### [√]compose(single):
1. init
> docker init

2. compose 
> docker compose up

compose.yaml can configure web, api together
check change do sync or rebuild
> docker compose watch

#### [×]Build a client and api minimal demo with compose
1. init
1.1. api
> npm init -y
> npm install express body-parser cors

1.2. client
> npx create-react-app client

2. build client
> docker build -t minimal-react .
> docker run -p 3000:3000 -v "%cd%":/app -v /app/node_modules minimal-react

[×]reason:
[not changing or resync file change ]
might be not excuting the watch command

#### [√]compose front and back
say we have file directory:
- client
-- Dockerfile
- api
-- Dockerfile
- compose.yaml

cd to compose.yaml same dir level
> docker compose up
> docker compose watch