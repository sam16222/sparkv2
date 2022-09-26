## Installation Guide

This document gives the instructions to install a system that provides basic video conferenceing capabilities with the novel functionality of using gestures to control base functionality through ML approaches. 

### All systems (Linux, Mac OS X, and Windows)

1. Create virtual enviornment and activate using python 3.10. (Need some help? Visit [here](https://docs.python.org/3/library/venv.html).)

```
$ python3 -m venv webapp
$ source webapp/bin/activate
```

2. Clone the repository. 

```
(webapp) $ git clone https://github.com/SiddarthR56/spark.git
```

3. Install requirements. The git repository is based on Express and includes a package.json with the needed dependencies. 

```
(webapp) $ npm i
```

4. Generate a local key/certificate for use in establishing a web connection. Both key and cert should be of type PEM. 

```
(webapp) $ openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
```

## User Guide 

You can run the software after installation with the following core commands: 

- To launch the frontend and connect with another user utilizing the start script within the package.json: 

```
(webapp) $ npm run start 
```

Then, the webapplication can be launched on port 3000. 

- From within the root of the repository, all test suites can be run with: 

```
(webapp) $ FILL IN HERE
```

- For more details, visit the help page from within the terminal: 

```
(webapp) $ FILL IN HERE
```

## Advanced details

TODO