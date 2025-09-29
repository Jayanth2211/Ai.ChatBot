import React from "react"

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Chat from "./Chat.jsx";
function VoiceRecognition(){
      const {transcript,listening,interimTranscript,browserSupportsSpeechRecognition,resetTranscript}=useSpeechRecognition()
    //Recognition is ready
    const start=React.useCallback(()=>SpeechRecognition.startListening({continuous:true,language:'en-IN',interimTranscript:true}),[])

    const stop=React.useCallback(()=>SpeechRecognition.stopListening(),[])

  // Correct reset function using useCallback
  const reset = React.useCallback(() => {
    resetTranscript(); // Use the function from the hook
  }, [resetTranscript]); // Add resetTranscript as dependency


 

    const displayText=transcript || interimTranscript

    if(!browserSupportsSpeechRecognition){
        return <span>Browser doesn't support speech recognition.</span>
    }
    return(
        
        <div>
            <Chat listening1={listening} start1={start} stop1={stop} reset1={reset} displayText1={displayText} browserSupportsSpeechRecognition1={browserSupportsSpeechRecognition}/>
            
        </div>
        
    )
}
export default VoiceRecognition