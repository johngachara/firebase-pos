import { Meilisearch } from "meilisearch";
import {ref} from "firebase/database";
import {database} from "./firebase";
import {useColorModeValue} from "@chakra-ui/react";
const client = new Meilisearch({
    host:import.meta.env.VITE_MEILISEARCH_URL,
    apiKey: import.meta.env.VITE_MEILISEARCH_KEY
});
const accessoryRef =  ref(database, 'alltech/Accessory');
const lcdRef =  ref(database, 'alltech/LCD');
export {client,accessoryRef,lcdRef}