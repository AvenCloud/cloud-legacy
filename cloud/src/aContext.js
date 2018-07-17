import React from 'react';
const AContext = React.createContext('aven');
export const withA = C => props => (
  <AContext.Consumer>{aven => <C {...props} aven={aven} />}</AContext.Consumer>
);
export default AContext;
