import { useState } from "react";
//This hook is for validating all form fields are present in update and create operations
export default function useValidate() {
    const [isValid, setIsValid] = useState(false);
    const validate = (data) => {
        let valid = true;

        if (!data.product_name.trim()) {
            //toast.error("Product name is required");
            valid = false;
        }
        if (!data.quantity || data.quantity < 0) {
            //toast.error("Quantity must be a positive number");
            valid = false;
        }
        if (!data.price || data.price < 0) {
            //toast.error("Price must be a positive number");
            valid = false;
        }
        setIsValid(valid);
        return valid;
    }

    return { isValid, validate };
}
