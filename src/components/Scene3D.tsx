import './Scene3D.css'

const Scene3D = () => {
  return (
    <div className="scene-3d" aria-hidden="true">
      <div className="scene-grid"></div>
      <div className="scene-shapes">
        <div className="shape shape-cube shape-1"></div>
        <div className="shape shape-cube shape-2"></div>
        <div className="shape shape-ring shape-3"></div>
        <div className="shape shape-diamond shape-4"></div>
        <div className="shape shape-cube shape-5"></div>
      </div>
      <div className="scene-glow"></div>
    </div>
  )
}

export default Scene3D
