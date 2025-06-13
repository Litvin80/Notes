import { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";


function PasswordInput({value, onChange, placeholder}) {

  const [isShowPassword, setIsShowPassword] = useState(false);
  const toggleShowPassword = () => {
    setIsShowPassword(!isShowPassword);
  };

    return (
        <div className="flex items-center bg-transparent border-[1.5px] border-gray-300 px-5 rounded mb-3">
            <input 
              value={value} 
              type={isShowPassword ? "text" : "password"} 
              onChange={onChange} placeholder={placeholder || "Пароль"}
              className="w-full text-sm bg-transparent py-3 mr-3 rounded outline-none"
            />
            {isShowPassword ? 
            ( <FaRegEye
                size={22}
                className="text-primary cursor-pointer"
                onClick={() => toggleShowPassword()}
              />
            ) : (
              <FaRegEyeSlash
                size={22}
                className="text-slate-400 cursor-pointer"
                onClick={() => toggleShowPassword()}
              />
            )}
        </div>
    );
};

export default PasswordInput;