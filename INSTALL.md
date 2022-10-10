## Installation Guide

This document gives the instructions to install a system that provides basic video conferencing capabilities with the novel functionality of using gestures to control base functionality through ML approaches. 

### All systems (Linux, Mac OS X, and Windows)

1. Clone the repository. 

```
$ git clone https://github.com/SiddarthR56/spark.git
```

2. Install requirements. The git repository is based on Express and includes a [package.json](package.json) and [package-lock.json](package-lock.json) with the needed dependencies. 

```
$ cd spark 
$ npm install
```

3. To confirm the installation was successful, run the base suite of tests. Ensure that all tests are passing.

```
$ npm run test
```

4. Launch the application. This can be done using the startup sequence defined within [package.json](package.json) or through running the command directly with nodemon. After running, you should be able to open up ```localhost:3000``` in any browser to access the application. 

```
# either use 
$ npm run start 

# or 
$ nodemon server.js
```

## User Guide 

You can run the software after installation with the following core commands: 

- To launch the frontend and connect with another user utilizing the start script within the package.json: 

```
# either use 
$ npm run start 

# or 
$ nodemon server.js
```

Then, the webapplication can be launched on port 3000. 

- From within the root of the repository, all test suites can be run with: 

```
$ npm run test
```

- And coverage can be determined by running: 

```
$ npm run coverage
```

- For more details, visit the help page from within the terminal: 

```
$ npm run help
```

## User workflows

1. User is directed to the homepage where they are asked to enter a room number they would like to join. If the room does not already exist, a new room will be created for the user, for example, Room 2 is created in our case here.

<img src="/docs/documentation_photos/ChooseRoomNo.png" alt="drawing" width="480" /> 

2. If another person wishes to join the room, they can simply enter the same room number to join the room. Currently, the application supports volume functions for mute/ unmute, video on/off, and screen share functionality. Gesture recognition is enabled by default for the mute/unmute and screen sharing functionalities.

<img src="/docs/documentation_photos/RoomWithOne.png" alt="drawing" width="480" /> 

3. By showing thumbs up/ down action towards the camera, either of the two users will be able to mute/ unmute their microphones. Similarly swipe left/ right action towards the camera will allow the users to share their screens with each other. In addition, users will also be able to disable gesture recognition by clicking the <b>Disable Gestures<b> button.

<img src="/docs/documentation_photos/MeetingWithTwo.png" alt="drawing" width="480" /> 

<img src="/docs/documentation_photos/ScreenSharing.png" alt="drawing" width="480" /> 
  
## Advanced details

Still looking for more details about expected behavior? Look in our [black box testing suite](https://github.com/SiddarthR56/spark/blob/main/docs/blackBoxTests.pdf) to learn about manual tests you can conduct that will help you learn more about the software. 

Having issue with a dependency not being available? Try to install the needed dependency with ```npm -i module-name```. 

Having an issue with the application functionality? Visit our [troubleshooting_guide](/docs/troubleshooting_guide.md) for advice and debugging options for common problems. 
