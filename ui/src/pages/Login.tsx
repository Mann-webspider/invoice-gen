import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { log } from "node:console";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login,setUser } = useAuth();
  // add a logic for automatic login if uthToken is available in localstorage then s=check the session in backend if yes then redirect to home page if not then redirect to login page
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        const response = await api.get("/check-session");
        if (response.data) {
          setUser(response.data.user.sub);
          
          navigate("/");
        }
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let login_res = await login(email, password);
      
      if(login_res.status === 401) {
        throw new Error("Login failed");
      }
      toast({
        title: "Success",
        description: "Login successful! Redirecting to home page.",
        variant: "success",})
      
      navigate("/");
    } catch (error: any) {
      console.log(error);
      
      const errorMessage = error.response?.data?.message || "Invalid credentials. Please try again. front";
      toast({title:"Error", description: errorMessage, variant: "destructive" });

      
      
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <form onSubmit={handleLogin}  className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
           
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login; 