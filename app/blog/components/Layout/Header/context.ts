import {createContext} from "react";
import {PostCategory} from "@/types/postCategory";


export const MenuContext = createContext<{
    categoryList?: PostCategory[]
}>({})
