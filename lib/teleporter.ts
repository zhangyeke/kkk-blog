import {createRoot} from "react-dom/client";

export const getBodyNode = ()=> document.body;


export const createTeleporter = ()=>{
    const body = getBodyNode();
    const wrapperFragment = document.createDocumentFragment();
    body.append(wrapperFragment);
    return createRoot(wrapperFragment,{identifierPrefix:"kkk"})
}
