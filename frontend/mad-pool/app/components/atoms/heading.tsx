import React from 'react';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 1,
  className = '',
  children,
  ...props
}) => {
  const styles = {
    1: 'text-4xl font-bold tracking-tight text-gray-900',
    2: 'text-3xl font-semibold tracking-tight text-gray-900',
    3: 'text-2xl font-semibold text-gray-900',
    4: 'text-xl font-semibold text-gray-900',
    5: 'text-lg font-semibold text-gray-900',
    6: 'text-base font-semibold text-gray-900',
  };

  const combinedClassName = `${styles[level]} ${className}`;

  switch (level) {
    case 1:
      return <h1 className={combinedClassName} {...props}>{children}</h1>;
    case 2:
      return <h2 className={combinedClassName} {...props}>{children}</h2>;
    case 3:
      return <h3 className={combinedClassName} {...props}>{children}</h3>;
    case 4:
      return <h4 className={combinedClassName} {...props}>{children}</h4>;
    case 5:
      return <h5 className={combinedClassName} {...props}>{children}</h5>;
    case 6:
      return <h6 className={combinedClassName} {...props}>{children}</h6>;
    default:
      return <h1 className={combinedClassName} {...props}>{children}</h1>;
  }
};

export default Heading;
