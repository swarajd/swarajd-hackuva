import {
  Constants,
  Permissions,
} from 'expo';

import React, {
  Component,
} from 'react';

import {
  Button,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#050A2B",
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#050A2B',
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
  },
  text: {
    color: '#CAC6B5',
    fontSize: 18,
    fontWeight: 'bold',
    margin: 24,
    textAlign: 'center',
  },
});

const mainScreen = "MAIN_SCREEN";
const loadingScreen = "LOADING_SCREEN";
const helpScreen = "HELP_SCREEN";

export default class App extends Component {
  state = {
    cameraPerm: null,
    locationPerm: null,
    screen: mainScreen,
  }

  componentWillMount = async () => {
    const askCamera = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({cameraPerm: askCamera.status === 'granted'});
    const askLocation = await Permissions.askAsync(Permissions.LOCATION);
    this.setState({locationPerm: askLocation.status === 'granted'});
  }

  takePhoto = async() => {
    const imageURI = await Expo.ImagePicker.launchCameraAsync();
    if (!imageURI.cancelled) {
      const imageFile = {
        uri: imageURI,
        type: 'image/png',
        name: 'picture',
      }
      const body = new FormData();
      body.append("picture", imageFile);
      const locationData = await Expo.Location.getCurrentPositionAsync({enableHighAccuracy: true});
      const locationStruct = {
        lat: locationData.coords.latitude,
        lng: locationData.coords.longitude,
        accuracy: locationData.coords.accuracy,
      }
      body.append("location.coordinates", JSON.stringify(locationStruct));
      try {
        this.setState({screen: loadingScreen});
        let postResponse = await fetch('http://34.207.94.186:5000/process_image', {
          method: 'POST',
          headers: {
            'Content-Type': 'image/png',
          },
          body,
        });
        const responseJSON = await postResponse.json();
        console.log("[+] Services:");
        if (responseJSON.services.fire) {
          console.log("    Fire: On the way");
        } else {
          console.log("    Fire: Idle");
        }
        if (responseJSON.services.medical) {
          console.log("    Medical: On the way");
        } else {
          console.log("    Medical: Idle");
        }
        if (responseJSON.services.police) {
          console.log("    Police: On the way");
        } else {
          console.log("    Police: Idle");
        }
        this.setState({screen: helpScreen});
      } catch (error) {
        console.error(error);
      }
    }
  }

  render() {
    if (this.state.cameraPerm === null || !this.state.cameraPerm || this.state.locationPerm === null || !this.state.locationPerm) {
      return (
        <View style={styles.container}>
            <Text style={styles.text}>
              {this.state.cameraPerm === null || !this.state.cameraPerm ? 'Camera' : 'Location'} privileges are disabled. Go to Settings > Privacy >  {this.state.cameraPerm === null || !this.state.cameraPerm ? 'Camera' : 'Location Services'} > MLTrek to enable.
            </Text>
        </View>
      );
    } else if (this.state.screen === mainScreen) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content"/>
          <TouchableOpacity style={styles.button} onPress={this.takePhoto}>
          <Image style={{resizeMode: 'center'}} source={require("./assets/Camera.png")}/>
          </TouchableOpacity>
        </View>
      );
    } else if (this.state.screen === loadingScreen) {
      return (
        <View style={styles.container}>
        <StatusBar barStyle="light-content"/>
        <Text style={styles.text}>Loading...</Text>
        </View>
      );
    } else if (this.state.screen === helpScreen) {
      return (
        <View style={styles.container}>
        <StatusBar barStyle="light-content"/>
        <Text style={styles.text}>Help is on the way!</Text>
        <Image style={{resizeMode: 'center'}} source={require("./assets/Help.png")}/>
        <View>
            <Button style={{position: 'absolute', right: 0}} color='#DD365E' title='Back' onPress={() => {this.setState({screen: mainScreen});}}/>
        </View>
        </View>
      );
    } else {
        return (
          <View style={styles.container}>
            <Text style={styles.text}>
              I don't know how you got here.
            </Text>
          </View>
        );
    }
  }
}
