const PageContainer = ({ children, className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;