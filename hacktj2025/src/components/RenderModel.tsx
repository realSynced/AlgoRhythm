import React from 'react'
import { Canvas } from '@react-three/fiber'

export default function RenderModel(children, className) {
    
    
    return (

        <Canvas className ={clsx("w-screen h-screen relative", className)}>
            <Suspense fallback={null}>
                {children}
            </Suspense>
        </Canvas>

    )
}