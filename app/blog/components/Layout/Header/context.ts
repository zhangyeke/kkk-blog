import {PostCategory} from "@/types/PostCategory";
import {createContext} from "react";

export const MenuContext = createContext<{
    categoryList?: PostCategory[]
}>({})
