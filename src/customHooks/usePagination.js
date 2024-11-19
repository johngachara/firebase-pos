//This is a custom hook for handling pagination in both itemList component and Accessories component


import { limitToFirst, onValue, orderByKey, query, startAt } from "firebase/database";
import { useState, useEffect, useCallback } from "react";


export default function usePagination(dataRef, PAGE_SIZE) {
    const [lastKey, setLastKey] = useState(null);
    const [products, setProducts] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback((lastKey = null) => {
        setLoading(true);
        setError(null);
        let firebaseQuery = query(dataRef, orderByKey(), limitToFirst(PAGE_SIZE + 1));
        if (lastKey) {
            firebaseQuery = query(dataRef, orderByKey(), startAt(lastKey), limitToFirst(PAGE_SIZE + 1));
        }

        const unsubscribe = onValue(firebaseQuery, (snapshot) => {
            const items = snapshot.val();
            if (items) {
                const keys = Object.keys(items);
                const newItems = keys.map((key) => ({
                    id: key,
                    ...items[key]
                }));

                const paginatedItems = newItems.length > PAGE_SIZE ? newItems.slice(0, PAGE_SIZE) : newItems;

                setLastKey(keys[keys.length - 1]);
                setProducts((prevProducts) => lastKey ? [...prevProducts, ...paginatedItems] : paginatedItems);
                setHasMore(newItems.length === PAGE_SIZE + 1);
            } else {
                setHasMore(false);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching data:", error);
            setError(error);
            setLoading(false);
        });

        return unsubscribe;
    }, [dataRef, PAGE_SIZE]);

    useEffect(() => {
        const unsubscribe = fetchData();
        return () => unsubscribe();
    }, []);

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchData(lastKey);
        }
    };

    return {
        products,
        hasMore,
        loading,
        error,
        loadMore,
        setLoading
    };
}