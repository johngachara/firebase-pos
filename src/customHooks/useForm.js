import {useState} from "react";

export default function useForm(initialValues) {
    const [data, setValues] = useState(initialValues);
    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues(prevState => ({
            ...prevState,
            [name]: value,
        }));
    };
    return{
        data,
        handleChange
    }
}
