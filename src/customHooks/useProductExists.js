import { useState } from "react";
import { equalTo, get, orderByChild, query, ref } from "firebase/database";
import { database } from "../components/firebase";

export default function useProductExists() {
    const [exists, setExists] = useState(false);

    const checkProductExists = async (productName,databaseRef) => {
        const dataRef = ref(database, `alltech/${databaseRef}`);
        const productQuery = query(dataRef, orderByChild('product_name'), equalTo(productName));
        const snapshot = await get(productQuery);
        const productExists = snapshot.exists();
        setExists(productExists); // Update state based on snapshot result
    };

    return { exists, checkProductExists };
}