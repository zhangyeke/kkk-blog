import {createContext} from "react";
import {PostCategory} from "@/types/PostCategory";


export const MenuContext = createContext<{
    categoryList?: PostCategory[]
}>({})
