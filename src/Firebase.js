import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; //import from the firebase authentication service 
import Axios from 'axios';
import { apiUrl } from "./App";

const firebaseConfig = {
    apiKey: "AIzaSyA_8-8jmjsiHryfqPkCdQwrmB1WVLopgsw",
    authDomain: "zone-2-tracker.firebaseapp.com",
    projectId: "zone-2-tracker",
    storageBucket: "zone-2-tracker.appspot.com",
    messagingSenderId: "543857707802",
    appId: "1:543857707802:web:cd631d523296787b407aa3"
};

//initialize Firebase
const app = initializeApp(firebaseConfig);
//represents everything related to user currently authenticated in firebase in the app 
export const auth = getAuth(app);
//create gmail provider
const provider = new GoogleAuthProvider();
//function to sign in
export const signInWithGoogle = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let signInResult = await signInWithPopup(auth, provider);
            const name = signInResult.user.displayName;
            const email = signInResult.user.email;
            localStorage.setItem("name", name);
            localStorage.setItem("email", email);

            //check is user is in the databse, add them if not
            console.log('Checking if this is a new user...')
            let userCheck = await Axios.get(`${apiUrl}/api/get/users/${email}`);
            const user = userCheck.data;
            if (user.length < 1) {
                //add user
                console.log('New user, adding them to the database...');
                await Axios.post(`${apiUrl}/api/adduser`,
                    {
                        email: email,
                        display_name: name
                    }
                ).then(result => {
                    if(result.statusText === 'OK') {
                        console.log('User successfully added to the database');
                    }
                })
            } else {
                console.log('Returning user');
            }
            resolve('User is signed in');
        } catch (err) {
            reject(err);
        }
    })
}