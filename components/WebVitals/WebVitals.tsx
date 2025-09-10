"use client"
import { useReportWebVitals } from 'next/web-vitals';
export default function WebVitals() {
    useReportWebVitals((metric)=>{
        // console.log("性能指标",metric)
    })
    return null
}
