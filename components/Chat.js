import React from 'react';
import { View, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// import { initializeApp } from 'firebase/app';
// import { getFirestore, collection, getDocs } from 'firebase/firestore';

//const app = initializeApp(firebaseConfig);


//import {firebase, firestore} from 'firebase';

// const firebase = require('firebase');
//   require('firebase/firestore');

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

    this.authUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        firebase.auth().signInAnonymously();
      }
      this.setState({
        uid: user.uid,
        messages: [],
      });
      this.unsubscribe = this.referenceChatMessages
        .orderBy("createdAt", "desc")
        .onSnapshot(this.onCollectionUpdate);
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
  onSend(messages = []) {
    this.setState((previousState) => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }));
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
    )
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

  // calback function for when user sends a message
    onSend(messages = []) {
        this.setState(previousState => ({
            messages: GiftedChat.append(previousState.messages, messages),
        }), () => {
            this.addMessages();
            this.saveMessages();
        })
    }

  render() {
    // feeding bgColor state
    let { bgColor } = this.props.route.params;

    return (
      <View style={{backgroundColor: bgColor, flex: 1}}>      
      <GiftedChat
        renderBubble={this.renderBubble.bind(this)}
        messages={this.state.messages}
        onSend={(messages) => this.onSend(messages)}
        user={{_id: 1}}
      />
      { Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null }
      </View>
    );
  }
}