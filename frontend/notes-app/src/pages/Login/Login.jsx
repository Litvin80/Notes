import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import PasswordInput from "../../components/Input/PasswordInput";
import { useState } from "react";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if(!validateEmail(email)) {
            setError("Будь ласка, введіть дійсну електронну адресу.");
            return;
        }

        if(!password) {
            setError("Будь ласка, введіть пароль");
            return;
        }

        setError("");

        try {
            const response = await axiosInstance.post("/login", { 
                email: email, 
                password: password,
            });

            if (response.data && response.data.accessToken) {
                localStorage.setItem("token", response.data.accessToken);
                navigate('/dashboard');
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError("Сталася непередбачена помилка. Будь ласка, спробуйте ще раз.");
            }
        }
    };

    return (
        <>
            <Navbar></Navbar>
            <div className="flex items-center justify-center mt-28">
                <div className="w-96 border border-gray-300 rounded bg-white px-7 py-10">
                    <form onSubmit={handleLogin}>
                        <h4 className="text-2xl mb-7">Вхід</h4>
                        <input 
                          type="text" 
                          placeholder="Пошта" 
                          className="input-box"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <PasswordInput 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && <p className="text-red-500 text-xs pb-1">{error}</p>}
                        <button type="submit" className="btn-primary bg-primary cursor-pointer">
                            Ввійти
                        </button>
                        <p className="text-sm text-center mt-4">
                            Ще не зареєстровані?{" "}
                            <Link to="/signUp" className="font-medium text-primary underline">
                                Створити акаунт
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Login;