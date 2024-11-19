import {useCallback, useEffect, useState} from "react";
import {client} from "../components/commonVariables";

export const useSearch = (
    initialSearchParam = '',
    index = '',
    debounceTime = 200
) => {
    const [searchParam, setSearchParam] = useState(initialSearchParam);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = useCallback(async () => {
        if (!searchParam) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        try {
            setSearchLoading(true);
            setError(null);
            const response = await client.index(index).search(searchParam);
            setSearchResults(response.hits);
            if (response.hits.length === 0) {
                setError({ title: "No items found", status: "info" });
            }
        } catch (error) {
            console.error("Error fetching search results:", error);
            setError({ title: "Error searching items", description: error.message, status: "error" });
        } finally {
            setSearchLoading(false);
        }
    }, [searchParam, index]);

    useEffect(() => {
        const debounceSearch = setTimeout(handleSearch, debounceTime);
        return () => clearTimeout(debounceSearch);
    }, [handleSearch, debounceTime]);

    return {
        searchParam,
        setSearchParam,
        searchResults,
        searchLoading,
        error,
        setSearchResults
    };
};