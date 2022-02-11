import React from 'react';
import { View, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { GiftedChat, Bubble, SystemMessage, InputToolbar  } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

import NetInfo from '@react-native-community/netinfo';
import MapView from 'react-native-maps'
//import CustomActions from './CustomActions'

import firebase from 'firebase';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAyN9xncI3Bq605A_hBuRNjZ3AkT4jsCxQ",
  authDomain: "chat-app-9e379.firebaseapp.com",
  projectId: "chat-app-9e379",
  storageBucket: "chat-app-9e379.appspot.com",
  messagingSenderId: "808284461061",
  appId: "1:808284461061:web:af594ad0ead4aaf653246c",
  measurementId: "G-W2MT4GER76"
};


export default class Chat extends React.Component {

  constructor() {
    super();
    this.state = {
      message: [],
      uid: 0,
			user: {
				_id: '',
				name: '',
				avatar: '',
			},
			isConnected: false,
    };

    //initializing firebase
		if (!firebase.apps.length) {
			firebase.initializeApp( firebaseConfig );
		}
		// reference to the Firestore messages collection
		this.referenceChatMessages = firebase.firestore().collection('messages');
		this.refMsgsUser = null;
  }


  componentDidMount() {
    // feeding name prop
    let name = this.props.route.params.name;
    this.props.navigation.setOptions({ title: name })
    //storage = getStorage(firebaseApp);

     //To find out user's connection status
    NetInfo.fetch().then(connection => {
      //actions when user is online
      if (connection.isConnected) {
          this.setState({ isConnected: true });
          console.log('online');
    
      
          // user can sign in anonymously
      this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
          if (!user) {
              await firebase.auth().signInAnonymously();
          }
          //update user state with currently active user data
          this.setState({
              uid: user.uid,
              messages: [],
              user: {
                  _id: user.uid,
                  name: name,
                  avatar: "https://placeimg.com/140/140/any",
              },
          });
          // listens for updates in the collection
          this.unsubscribe = this.referenceChatMessages
          .orderBy("createdAt", "desc")
          .onSnapshot(this.onCollectionUpdate)
          //referencing messages of current user
          this.refMsgsUser = firebase
          .firestore()
          .collection("messages")
          .where("uid", "==", this.state.uid);
          });
          //save messages when online
          this.saveMessages();
      } else {
          this.setState({ isConnected: false });
          console.log('offline');
          //retrieve chat from asyncstorage
          this.getMessages();
      }   
    });
  }
  

  onCollectionUpdate = (querySnapshot) => { 
        const messages = [];
        // go through each document
        querySnapshot.forEach((doc) => {
            // get the QueryDocumentSnapshot's data
            let data = doc.data();
            messages.push({
                _id: data._id,
                text: data.text,
                createdAt: data.createdAt.toDate(),
                user: {
                    _id: data.user._id,
                    name: data.user.name,
                    avatar: data.user.avatar
                },
                image: data.image || null,
                location: data.location || null,
            });
        });
        this.setState({
            messages: messages
        });
    };

    //unsubscribe from collection updates
    componentWillUnmount() {
        this.authUnsubscribe();
        this.unsubscribe();
    }
  // when message sends, appends to message array
  // onSend(messages = []) {
  //   this.setState((previousState) => ({
  //     messages: GiftedChat.append(previousState.messages, messages),
  //   }));
  // }
  onSend(messages = []) {
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }), () => {
        this.addMessages();
        this.saveMessages();
    })
  }

  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#1b72ba'
          }
        }}
      />
    );
  }  

  renderSystemMessage(props) {
      return <SystemMessage {...props} textStyle={{ color: '#330404' }} />;
  }

    //custom map view
    renderCustomView(props) {
        const { currentMessage } = props;
        if (currentMessage.location) {
            return (
                <MapView
                    style={{ width: 150, height: 100, borderRadius: 13, margin: 3 }}
                    region={{
                        latitude: currentMessage.location.latitude,
                        longitude: currentMessage.location.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                />
            );
        }
        return null;
    }

  addMessages() { 
    const message = this.state.messages[0];
    // add a new messages to the collection
    this.referenceChatMessages.add({
      _id: message._id,
      text: message.text || "",
      createdAt: message.createdAt,
      user: this.state.user,
      image: message.image || "",
      location: message.location || null,
    });
  }

  //retrieve chat from asyncStorage
    async getMessages(){
        let messages = '';
        try {
            //wait until asyncStorage promise settles
            messages = await AsyncStorage.getItem('messages') || [];//set empty if there is no storage item
            this.setState({
                messages: JSON.parse(messages)//convert the saved string back into an object
            });
        } catch (error) {
            console.log(error.message);
        }
    }

    // save messages on the asyncStorage
    async saveMessages() {
        try {
            await AsyncStorage.setItem('messages', JSON.stringify(this.state.messages));
        } catch (error) {
            console.log(error.message);
        }
    }


    //delete stored messages
    async deleteMessages() {
        try {
            await AsyncStorage.removeItem('messages');
            this.setState({
                messages: []
            })
        } catch (error) {
            console.log(error.message);
        }
    }

  // calback function for when user sends a message
    onSend(messages = []) {
        this.setState(previousState => ({
            messages: GiftedChat.append(previousState.messages, messages),
        }), () => {
            this.addMessages();
            this.saveMessages();
        })
    }

    // hides inputbar when offline
    renderInputToolbar = (props) => {
        console.log("renderInputToolbar --> props", props.isConnected);
        if (props.isConnected === false) {
            return <InputToolbar {...props} />
        } else {
            return <InputToolbar {...props} />;
        }
    };


  render() {
    // feeding bgColor state
    let { bgColor } = this.props.route.params;

    return (
      <View style={{backgroundColor: bgColor, flex: 1}}>
      <GiftedChat
        renderDay={this.renderDay}
        messages={this.state.messages}
        onSend={messages => this.onSend(messages)}
        renderBubble={this.renderBubble.bind(this)}
        renderInputToolbar={this.renderInputToolbar.bind(this)}
        renderCustomView={this.renderCustomView}
        user={{
            _id: this.state.user._id,
            name: this.state.name,
            avatar: this.state.user.avatar
        }}
      />  
      { Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null }
      </View>
    );
  }
}