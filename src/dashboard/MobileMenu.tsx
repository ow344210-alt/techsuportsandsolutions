import {
  Menu,
  X,
  LayoutDashboard,
  User,
  LogOut
} from "lucide-react";

import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";


export default function MobileMenu(){

const [open,setOpen]=useState(false);

const {signOut}=useAuth();



async function logout(){

await signOut();

window.location.href="/login";

}



return (

<>


<button

onClick={()=>setOpen(true)}

className="
md:hidden
p-2
rounded-xl
bg-slate-100
border
border-slate-200
text-slate-900
dark:bg-white/5
dark:border-white/10
dark:text-white
"

>

<Menu size={24}/>

</button>





{
open && (

<div
className="
fixed
inset-0
z-50
md:hidden
"
>


<div

onClick={()=>setOpen(false)}

className="
absolute
inset-0
bg-black/60
"

/>




<div

className="
absolute
left-0
top-0
h-full
w-72
bg-white
border-r
border-slate-200
p-6
text-slate-900
dark:bg-[#080D1A]
dark:border-white/10
dark:text-white
"

>



<div
className="
flex
items-center
justify-between
mb-10
"
>

<h2
className="
text-xl
font-bold
text-slate-900
dark:text-white
"
>
Tech Supports
</h2>



<button

onClick={()=>setOpen(false)}
className="rounded-full border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
>

<X/>

</button>


</div>





<nav className="space-y-3">


<Link

to="/dashboard"

onClick={()=>setOpen(false)}

className="
flex
items-center
gap-3
px-4
py-3
rounded-xl
bg-slate-100
text-slate-900
dark:bg-white/5
dark:text-white
"

>

<LayoutDashboard size={20}/>

Dashboard

</Link>





<Link

to="/profile"

onClick={()=>setOpen(false)}

className="
flex
items-center
gap-3
px-4
py-3
rounded-xl
text-slate-700
hover:bg-slate-100
dark:text-white
dark:hover:bg-white/5
"

>

<User size={20}/>

Profile

</Link>




<button

onClick={logout}

className="
flex
items-center
gap-3
px-4
py-3
rounded-xl
text-red-500
hover:bg-red-500/10
dark:text-red-400
"

>

<LogOut size={20}/>

Logout

</button>



</nav>



</div>


</div>


)

}


</>

);

}