import React from 'react'

const Container = (props) => {
  return <>
    <section className={props.class1}>
    <div className='container-fluid mar-4'>{props.children}</div>
    </section>
  </>
}

export default Container
