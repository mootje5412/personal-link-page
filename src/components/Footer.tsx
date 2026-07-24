import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p>Apex Panel · {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}

export default Footer
