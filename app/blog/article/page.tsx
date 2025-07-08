import {Suspense} from "@/components/Loader";
import {ArticleList} from "@/app/blog/components/Article";





export default function Web() {

    return (
        <div className="text-primary">

            <Suspense >
                <ArticleList/>
            </Suspense>
        </div>
    )
}
