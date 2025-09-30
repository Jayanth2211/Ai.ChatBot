import React from "react"

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function useVoiceRecognition(){
      const {transcript,listening,interimTranscript,browserSupportsSpeechRecognition,resetTranscript}=useSpeechRecognition()
    //Recognition is ready
    const startListen=React.useCallback(()=>SpeechRecognition.startListening({continuous:true,language:'en-IN',interimTranscript:true}),[])

    const stopListen=React.useCallback(()=>SpeechRecognition.stopListening(),[])

  // Correct reset function using useCallback
  const reset = React.useCallback(() => {
    resetTranscript(); // Use the function from the hook
  }, [resetTranscript]); // Add resetTranscript as dependency


 

    const displayText=transcript || interimTranscript

    if(!browserSupportsSpeechRecognition){
        return <span>Browser doesn't support speech recognition.</span>
    }
    return {listening,startListen,stopListen,reset,displayText,browserSupportsSpeechRecognition}
        
        
        
    
}
export default useVoiceRecognition