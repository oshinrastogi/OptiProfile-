// import { useState,useContext,createContext ,useEffect} from "react";
// import axios from "axios";
// // import { Cookies } from "react-cookie";

// const AuthContext = createContext();

// const AuthProvider =({children})=>{
//     const [auth,setAuth] = useState({
//         user:null,
//         token:""
//     });
//     //default axios 

//     axios.defaults.headers.common['Authorization']=auth?.token
//     axios.defaults.withCredentials = true;
//     useEffect(()=>{
//         const data=localStorage.getItem('auth');
//         if(data){
//             const parseData=JSON.parse(data);
//             setAuth({
//                 ...auth,
//                 user:parseData.user,
//                 token:parseData.token
//             })
//         }
//         else{
            
//              const { data } = axios.get(`${import.meta.env.VITE_BACKEND_API}/api/v1/auth/current-user`); // Your backend endpoint
//                 console.log(data);
//                 if (data?.success && data?.user) {
//                     console.log("Auth: Backend validation successful. User is authenticated.");
//                     setAuth(prevAuth => ({
//                         user: data.user, // Always update user data from backend (most authoritative)
//                         token: prevAuth.token || "", // Keep token if it was from localStorage, otherwise empty
//                     }));
//                     // Ensure user data is consistent in localStorage after successful backend validation
//                     localStorage.setItem('auth_user_data', JSON.stringify(data.user));
//                 } else {
//                     // Backend indicates not authenticated (cookie invalid/expired, no token found)
//                     console.log("Auth: Backend validation failed. Clearing auth state.");
//                     setAuth({ user: null, token: "" }); // Clear auth state
//                     localStorage.removeItem('auth_user_data'); // Clear user data
//                     localStorage.removeItem('auth'); // Clear any old 'auth' key (if used for full object)
//                 }
//         }
        
//         //eslint-disable-next-line
//     },[]);
//     return (
//         <AuthContext.Provider value={[auth,setAuth]}>
//             {children}
//         </AuthContext.Provider>
//     );
// };


// //custom hook

// const useAuth =() => useContext(AuthContext);

// export {useAuth,AuthProvider};

// src/context/auth.js
import { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        token: "",
    });

    axios.defaults.withCredentials = true;

    axios.defaults.baseURL = import.meta.env.VITE_BACKEND_API;

    useEffect(() => {
        if (auth.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [auth.token]); 

    useEffect(() => {
        const checkAuthStatus = async () => {
            let userFromLocalStorage = null;

            const storedUserData = localStorage.getItem('auth_user_data');
            if (storedUserData) {
                try {
                    userFromLocalStorage = JSON.parse(storedUserData);
                    setAuth(prevAuth => ({
                        ...prevAuth, 
                        user: userFromLocalStorage, 
                    }));
                    console.log("Auth: User data partially initialized from localStorage.");
                } catch (e) {
                    console.error("Auth: Error parsing localStorage 'auth_user_data':", e);
                    localStorage.removeItem('auth_user_data'); // Clear corrupt data
                }
            }

            // console.log("Auth: Attempting to validate auth status with backend...");
            try {
                const { data } = await axios.get('/api/v1/auth/current-user'); // Your backend endpoint

                if (data?.success && data?.user) {
                    console.log("Auth: Backend validation successful. User is authenticated.");
                    setAuth(prevAuth => ({
                        user: data.user,
                        token: prevAuth.token || "", 
                    }));
                    localStorage.setItem('auth_user_data', JSON.stringify(data.user));
                } else {
                    console.log("Auth: Backend validation failed. Clearing auth state.");
                    setAuth({ user: null, token: "" }); 
                    localStorage.removeItem('auth_user_data'); // Clear user data
                    localStorage.removeItem('auth'); // Clear any old 'auth' key (if used for full object)
                }
            } catch (error) {
                console.error("Auth: Backend auth validation failed:", error.response?.data?.message || error.message);
                // On error (e.g., network error, 401/403 from backend), clear auth state.
                setAuth({ user: null, token: "" });
                localStorage.removeItem('auth_user_data');
                localStorage.removeItem('auth');
            }
        };

        checkAuthStatus();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array means this effect runs only once on mount

    return (
        <AuthContext.Provider value={[auth, setAuth]}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

export { useAuth, AuthProvider };