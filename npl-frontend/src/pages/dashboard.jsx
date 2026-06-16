import {useEffect} from 'react'



function Dashboard() {
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            window.location.href = '/' // redirect to login if no token
        }
    }, [])

    return(<div> <h1>Dashboard</h1> </div>)
}

export default Dashboard