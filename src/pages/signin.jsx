import { auth, database, googleprovider } from '../config/firebase';
import { useState, useEffect, useRef } from "react";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import googlepic from '../assets/Googlepic.png';
import { addDoc, collection } from 'firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
const Signin = () => {
    const [username, setUsername]=useState('');
    const navigate = useNavigate();
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate("/home");
            }
        });

        return () => unsubscribe();
    }, [navigate]);
    const signInWithGoogle = async () => {
        if (!username) {
            alert("Please enter username");
            return;
        }
        try {
            await signInWithPopup(auth, googleprovider);
            addUser();
            navigate("/home");
        } catch (error) {
            console.error("Error signing in with Google:", error.message);
            alert("Error signing in with Google. Please try again.");
        }
    };
     const addUser = async () => {
        const userRef = collection(database, "Users");
        const userDocRef = doc(userRef, auth.currentUser.uid);

        try {
            const docSnap = await getDoc(userDocRef);

            if (!docSnap.exists()) {
                await setDoc(userDocRef, {
                    username: username,
                    email: auth.currentUser?.email,
                });
            }
        } catch (err) {
            console.error("Error adding user:", err);
        }
    };
  return (
    <div>
        <label>Enter your username</label>
        <br />
        <input type='text' placeholder='enter your username' value={username} onChange={(e)=>setUsername(e.target.value)} />
        <div className="buttons flex flex-col justify-center items-center mx-auto mt-10 codepen-button before:-z-10  md:w-3/4 rounded-full">
            <button className='text-white bg-black russo w-full rounded-full py-1 text-l md:w-full flex justify-center items-center gap-2 hover:scale-105 transition-all' onClick={signInWithGoogle}><img className='w-10' src={googlepic} />  Sign in with Google</button>
        </div>
    </div>
  )
}

export default Signin