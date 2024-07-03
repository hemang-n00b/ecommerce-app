import React from 'react'
import BreadCrumb from '../components/BreadCrumb'
import { Link } from "react-router-dom";
import Meta from '../components/Meta'
import watch from '../images/watch.jpg';
const Cart = () => {
  return (
    <>
      <Meta title={"Cart"}/>
      <BreadCrumb title="Cart"/>
      <section className="cart-wrapper home-wrapper-2 py-5">
        <div className='container-fluid'>
            <div className='row'>
                <div className='col-12'>
                    <div className='card-header py-3 d-flex justify-content-between align-items-center'>
                        <h4 className='cart-col-1'>Product</h4>
                        <h4 className='cart-col-2'>Price</h4>
                        <h4 className='cart-col-3'>Quantity</h4>
                        <h4 className='cart-col-4'>Total</h4>
                    </div>
                    <div className='card-data py-3 d-flex justify-content-between align-items-center'>
                        <div className='gap-15 cart-col-1 d-flex align-items-center'>
                            <div className='w-25'>
                                <img src={watch} className='img-fluid' alt="product here" height='100'></img>
                            </div>
                            <div className='w-75'>
                                <h5 className='title'> GDFFDHG</h5>
                                <p className='color'>hgf</p>
                                <p className='sixe'>gfd</p>
                            </div>
                        </div>
                        <div className='cart-col-2'>
                            <h5 className='price'>$ 100 ggf</h5>
                        </div>
                        <div className='cart-col-3'></div>
                        <div className='cart-col-4'></div>

                    </div>
                </div>
            </div>
        </div>
      </section>
    </>
  )
}

export default Cart
