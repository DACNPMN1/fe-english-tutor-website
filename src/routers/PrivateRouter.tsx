import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { Redirect, Route, useLocation } from 'react-router-dom';
import { RootState } from '../redux/rootReducer';
import { getInfo } from '../redux/slice/appSlice/userSlice';
import { useAppDispatch } from '../redux/store';

export const PrivateRouter: React.FC<IPrivateRouter> = ({
  component: Component,
  layout: Layout,
  exact,
  path,
  header: Header,
  footer: Footer,
  isHasFooter,
  isHasHeader,
  titleHeader,
  typeHeader,
  isHasGradiant,
  backPath,
  withoutAvatar,
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation().pathname;
  const [isFetch, setIsFectch] = useState(false);
  const isAccount = useSelector((state: RootState) => state.userSlice.isAccount);
  const fecthInfo = async () => {
    const check = (await dispatch(getInfo({ jwt: localStorage.getItem('accessToken') }))).payload;
    console.log('check', check);

    if (
      check === true ||
      check === false ||
      String(typeof check) === 'object' ||
      check === undefined
    ) {
      setIsFectch(true);
    }
  };
  useEffect(() => {
    fecthInfo();
    return;
  }, [location]);

  console.log('isAccount', isAccount);
  console.log('location', location);

  const render = (props: any) => {
    if (isAccount == false && location === '/log-out') {
      return <Redirect to="/student/login" />;
    }

    return isFetch == false ? (
      <div style={{ marginTop: '20px' }}>
        <Spinner animation="grow" variant="primary" />
        <Spinner animation="grow" variant="secondary" />
        <Spinner animation="grow" variant="success" />
        <Spinner animation="grow" variant="danger" />
        <Spinner animation="grow" variant="warning" />
        <Spinner animation="grow" variant="info" />
        <Spinner animation="grow" variant="light" />
        <Spinner animation="grow" variant="dark" />
      </div>
    ) : isAccount ? (
      <Layout
        header={
          isHasHeader ? (
            <Header
              title={titleHeader}
              type={typeHeader}
              onClick={props.history.goBack}
              path={backPath}
              withoutAvatar={withoutAvatar}
            />
          ) : (
            <></>
          )
        }
        footer={isHasFooter ? <Footer /> : <></>}
      >
        <Component {...props} />
      </Layout>
    ) : (
      <Redirect to="/student/login" />
    );
  };

  return <Route exact={exact} path={path} render={render} />;
};
