import * as React from 'react';

export interface GoogleMarkProps extends React.SVGAttributes<SVGSVGElement> {
  /** Square pixel size. @default 18 */
  size?: number;
}

export declare function GoogleMark(props: GoogleMarkProps): JSX.Element;
