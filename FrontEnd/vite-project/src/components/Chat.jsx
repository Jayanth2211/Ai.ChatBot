import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { MicOff } from './micoff.jsx';
import { MicrophoneIcon, SpeakerWaveIcon,SpeakerXMarkIcon, PauseIcon,PlayIcon, UserIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useSpeak } from 'react-text-to-speech';
import { useLocation } from './locationservices.jsx';
import useVoiceRecognition from './voiceRecognition.jsx';

const Chat = () => {
  const { ipLocation,
    deviceLocation,
    areaName,
    loading,
    error,
    fetchIPLocation,
    getDeviceLocation,
   fetchLocation
  }=useLocation()
//speak
const [textMsg,setTextMessage]=React.useState("he i am fine")
  const {start,pause,stop,speechStatus}=useSpeak({text:textMsg})
  const [pauseVoice,setPause]=React.useState(true)
   

  const {listening,startListen,stopListen,reset,displayText,browserSupportsSpeechRecognition}=useVoiceRecognition()
    const [micro,setMicro]=useState(true)

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

   const timeout=React.useRef(null)
    
    const startTimer=()=>{
      timeout.current=setTimeout(()=>{
       
        stopListen()
         setMicro(true)
         
        
        
    },5000)
    }

    const resetTimer=()=>{
      clearTimeout(timeout.current)
      startTimer()
    }

    const clearInactivityTimer=()=>{
      clearTimeOut(timeout.current)
    }

 useEffect(()=>{
   resetTimer()
 },[listening,displayText])


 function say(content){
    const res=messages.filter((x)=>x.text==content)
    setTextMessage(res[0].text)
    
    start()
    setPause(true)

  }
  function pause_voice(){
    pause()
    setPause(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

    useEffect(() => {
    scrollToBottom();
  }, [messages]);
React.useEffect(()=>{
  if(displayText){
    setInput(displayText)
  }
},[displayText])
 const startRconize=React.useCallback(()=>{
   if(micro){
    startListen()
  
   }
   else{
    stopListen()
   }
   setMicro(!micro)
   console.log("execution");
   
   
 },[micro])

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    if(displayText){
      stopListen()
      setMicro(true)
    }
    setMessages(prev => [...prev, { text: userMessage, isAi: false }]);
    setIsLoading(true);
    
      fechData()
    
    async function fechData() {
      if(userMessage.toLowerCase().includes("location")  || userMessage.toLowerCase().includes("place")){
           // Wait for both location functions to complete
          
      try{
        const ipData = await fetchIPLocation();
      const deviceData = await getDeviceLocation();
      
      
      console.log("Device Data:", deviceData)
        console.log("Device Data:", ipData)
      const locationMessage=`Your location: ${deviceData.areaName.address || ipData.area }`
      setMessages(pre=>[...pre,{text:locationMessage,isAi:true}])

      }
      catch(err){
        setMessages(prev=>[...prev,{text:"can't able to fetch location",isAi:true}])
      }
      finally{
        setIsLoading(false)
      }
    }
      else if(userMessage.toLowerCase().includes("wether")){
        try{
          const {latitude,longitude}=await fetchLocation()
          const api_key='82ccdfb8e81f438eadf205357253009'
          const res=await fetch(`http://api.weatherapi.com/v1/current.json?key=${api_key}&q=${latitude},${longitude}`)
          const data=await res.json()
          
         let weatherMessage = "";

// Time-based greeting
const currentHour = new Date().getHours();
const isDay = data.current.is_day;
if (isDay === 1) {
    if (currentHour < 12) weatherMessage += "Good morning! ";
    else if (currentHour < 17) weatherMessage += "Good afternoon! ";
    else weatherMessage += "Good evening! ";
} else {
    weatherMessage += "Good evening! ";
}

// Location with coordinates
weatherMessage += `At your current location (${data.location.lat}, ${data.location.lon}) in ${data.location.name}, `;

// Temperature explanation
if (data.current.temp_c > 35) {
    weatherMessage += `it's very hot at ${data.current.temp_c}°C. `;
} else if (data.current.temp_c > 28) {
    weatherMessage += `it's quite warm at ${data.current.temp_c}°C. `;
} else if (data.current.temp_c > 22) {
    weatherMessage += `the temperature is pleasant at ${data.current.temp_c}°C. `;
} else if (data.current.temp_c > 15) {
    weatherMessage += `it's mild at ${data.current.temp_c}°C. `;
} else if (data.current.temp_c > 5) {
    weatherMessage += `it's cool at ${data.current.temp_c}°C. `;
} else {
    weatherMessage += `it's cold at ${data.current.temp_c}°C. `;
}

// Weather condition
const condition = data.current.condition.text.toLowerCase();
if (condition.includes("sunny") || condition.includes("clear")) {
    weatherMessage += "The skies are clear and sunny. ";
} else if (condition.includes("partly cloudy")) {
    weatherMessage += "It's partly cloudy. ";
} else if (condition.includes("cloudy") || condition.includes("overcast")) {
    weatherMessage += "The sky is overcast with clouds. ";
} else if (condition.includes("rain") || condition.includes("drizzle")) {
    weatherMessage += "There's rainfall. ";
} else if (condition.includes("snow")) {
    weatherMessage += "It's snowing. ";
} else {
    weatherMessage += `The weather is ${data.current.condition.text}. `;
}

// Wind explanation
if (data.current.wind_kph > 25) {
    weatherMessage += `Strong winds are blowing from ${data.current.wind_dir} at ${data.current.wind_kph} km/h. `;
} else if (data.current.wind_kph > 15) {
    weatherMessage += `There's a moderate breeze from ${data.current.wind_dir} at ${data.current.wind_kph} km/h. `;
} else if (data.current.wind_kph > 5) {
    weatherMessage += `A light breeze is coming from ${data.current.wind_dir}. `;
} else {
    weatherMessage += "The air is calm with little wind. ";
}

// Humidity explanation
if (data.current.humidity > 80) {
    weatherMessage += "The humidity is very high, so it might feel muggy. ";
} else if (data.current.humidity > 60) {
    weatherMessage += "The humidity is moderate. ";
} else if (data.current.humidity < 30) {
    weatherMessage += "The air is quite dry. ";
} else {
    weatherMessage += "Humidity levels are comfortable. ";
}

// Time-specific advice
if (isDay === 0) { // Night time
    weatherMessage += "Enjoy the night weather!";
} else { // Day time
    if (data.current.temp_c > 28) {
        weatherMessage += "Stay hydrated if you're going out!";
    } else if (data.current.temp_c < 10) {
        weatherMessage += "Dress warmly today!";
    } else {
        weatherMessage += "Perfect weather for outdoor activities!";
    }
}

console.log(weatherMessage);
setMessages(prev=>[...prev,{text:weatherMessage,isAi:true}])
          
        }
        catch(err){
          setMessages(prev=>[...prev,{text:"Your Browser not supporting Try Again",isAi:true}])
          
        }
        finally{
          setIsLoading(false)
        }
        
        

      }
     else{
       try {
        const response = await fetch('https://ai-chatbot-5-l8lf.onrender.com/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage }),
        });

        const result = await response.json();
        console.log('Server response:', result);

        // Handle different response formats
        const aiMessage = result.message || result.error || "I'm not sure how to respond.";
        setMessages(prev => [...prev, { text: aiMessage, isAi: true }]);

      } catch (error) {
        console.error('Fetch error:', error);
        setMessages(prev => [...prev, {
          text: 'Network error. Is the server running?',
          isAi: true
        }]);
      } finally {
        setIsLoading(false);
      }
     }
     
       reset()
    }
  };

  return (
    <div className=" flex flex-col h-screen ">
      <div className="w-full h-[10%]  bg-gray-100 border-b border-gray-200 shadow-sm">
        <div className="max-w-[95%]  mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <h1 className="text-[80%] transform scale-140 w-[40%] font-bold text-gray-900 flex items-center gap-2">
            <span className="text-[100%] text-pink-600"><span className='text-3xl'>O</span><span className='text-2xl'>r</span>vix</span>  AI </h1>
            <div className='w-[40%] flex flex-col items-end justify-end gap-1'><span className='text-slate-700 font-semibold'>  <a href="https://jayanth-portfolio.onrender.com/" target='_blank'>&copy;JAYANTH</a></span></div>
          
        </div>
        
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-200 p-4 space-y-6 ">
        {messages.length === 0 ? (
          <div className="flex flex-col  items-center justify-center h-full text-center text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xl font-medium">Start a conversation</p>
            <p className="mt-2">Ask me anything!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <><ChatMessage key={index} message={message.text} isAi={message.isAi} />{message.isAi? (
              <div className="speaker_box relative   flex gap-1 items-center justify-center">
                <button className='bg-sky-200 rounded-full p-1 text-black border-2 border-sky-300 font-semibold focus:ring-2 focus:ring-offset-2 focus:ring-sky-300 hover:shadow-lg hover:shadow-zinc-300' onClick={()=>say(message.text)}>
              <SpeakerWaveIcon className='h-4 w-4'/>
            </button>
             <button className='bg-sky-200 rounded-full p-1 text-black border-2 border-sky-300 font-semibold focus:ring-2 focus:ring-offset-2 focus:ring-sky-300 hover:shadow-lg hover:shadow-zinc-300' onClick={stop}>
              <SpeakerXMarkIcon className='h-4 w-4'/>
            </button>
             <button className='bg-sky-200 rounded-full p-1 text-black border-2 border-sky-300 font-semibold focus:ring-2 focus:ring-offset-2 focus:ring-sky-300 hover:shadow-lg hover:shadow-zinc-300' disabled={speechStatus!="started"} onClick={pause_voice}>
              {
                pauseVoice? <PauseIcon className='h-4 w-4'/>:<PlayIcon className='h-4 w-4'/>
              }
              
            </button>
              </div>
            ):''}</>
          ))
        )}
        {isLoading && (
          <div className="flex items-center justify-center space-x-2 p-4">
            <div className="animate-bounce h-2 w-2 bg-pink-500 rounded-full"></div>
            <div className="animate-bounce h-2 w-2 bg-pink-500 rounded-full delay-100"></div>
            <div className="animate-bounce h-2 w-2 bg-pink-500 rounded-full delay-200"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-none p-6 bg-gray-100 h-[18%]  border-t border-gray-200 shadow-lg">
        
        
        <form onSubmit={handleSubmit} className="max-w-7xl  mx-auto w-full">
          <div className="flex flex-col space-y-3">
            {listening && (
        <div className="flex items-center mb-2">
          <div className="w-3 h-3 bg-sky-800 rounded-full animate-pulse mr-2"></div>
          <span className="text-sm">Listening...</span>
        </div>
      )}
            <div className="relative flex items-center">
               <button
                type="button"
                onClick={startRconize}
                disabled={isLoading || speechStatus=='started'}
                className="absolute left-2 inline-flex items-center justify-center w-12 h-12 rounded-xl text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-white "
              >
                
                {micro? <MicrophoneIcon className="h-6 w-6 " />:<MicOff/>}
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 min-h-[60px] w-[100%] rounded-2xl border-2 border-gray-300 px-20 py-4 text-base focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 transition-all duration-200 pr-16"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 inline-flex items-center justify-center w-12 h-12 rounded-xl text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <PaperAirplaneIcon className="h-6 w-6 rotate" />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Press Enter to send your message
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat; 