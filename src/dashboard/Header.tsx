import { useAuth } from "../hooks/useAuth";
import { UserCircle } from "lucide-react";
import MobileMenu from "./MobileMenu";


export default function Header(){

const { user } = useAuth();



const name =
user?.user_metadata?.full_name ||
"User";



const email =
user?.email;



const avatar =
user?.user_metadata?.avatar_url;



return (

<header
className="
h-20
border-b
border-slate-200
flex
items-center
justify-between
px-6
bg-white/80
dark:border-white/10
dark:bg-white/[0.03]
"
>



<div className="
flex
items-center
gap-4
">



    

<MobileMenu />

<h1
className="
text-xl
font-semibold
text-slate-900
dark:text-white
"
>
Dashboard
</h1>

</div>





<div
className="
flex
items-center
gap-4
"
>



<div
className="
text-right
hidden
sm:block
"
>

<p
className="
text-sm
font-medium
text-slate-900
dark:text-white
"
>

{name}

</p>


<p
className="
text-xs
text-slate-500
dark:text-gray-400
"
>

{email}

</p>


</div>






{
avatar
?

<img

src={avatar}

alt="profile"

className="
h-11
w-11
rounded-full
object-cover
border
border-purple-500/40
"

/>

:

<div
className="
h-11
w-11
rounded-full
bg-purple-600/30
border
border-purple-400/30
flex
items-center
justify-center
"
>


<UserCircle
size={28}
className="
text-purple-300
"
/>


</div>

}



</div>



</header>

);

}