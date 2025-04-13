const { User, Order } = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/sendMail');

exports.register = async (req, res) => {
    console.log(req.body)
    const { name, mobile, email, pass } = req.body;
    try {
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ msg: 'User already exists', success: false });

        const hashedPwd = await bcrypt.hash(pass, 10);
        const user = new User({ name, mobile, email, password: hashedPwd });
        await user.save();
        res.json({ msg: 'Registered successfully', success: true });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', success: false });
    }
};

exports.login = async (req, res) => {
    const { email, pass } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials', success: false });

        const match = await bcrypt.compare(pass, user.password);
        if (!match) return res.status(400).json({ msg: 'Invalid Password', success: false });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ token, user, msg: "Login Successful", success: true });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', success: false });
    }
};

exports.orders = async (req, res) => {
    try {
        const { userId, quantity, image } = req.body;

        if (!userId || !quantity || !image) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const order = new Order({ userId, quantity, image });
        await order.save();

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        var subject = "🎁 Order Confirmation - VR Wonders";
        var html = `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #e91e63; text-align: center;">Thank You for Your Order!</h2>
              
              <p style="font-size: 16px;">Hi <strong>${user.name}</strong>,</p>
              
              <p style="font-size: 16px;">
                We’re excited to let you know that we've received your order with <strong>VR Wonders</strong> 🎉
              </p>
        
              <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; font-weight: bold; background-color: #fce4ec; border: 1px solid #f8bbd0;">Quantity:</td>
                  <td style="padding: 10px; border: 1px solid #f8bbd0;">${quantity}</td>
                </tr>
              </table>
        
              <p style="font-size: 16px;">
                Our team will contact you shortly to discuss your gift customization preferences and finalize the details.
              </p>
        
              <p style="font-size: 16px;">
                If you have any questions or special requests, feel free to reply to this email.
              </p>
        
              <br>
              <p style="font-size: 16px;">Warm regards,<br><strong>VR Wonders Team</strong></p>
            </div>
          </div>
        `;
        

        await sendMail(user.email, subject, '', html);


        subject = "📦 New Client Order – VR Wonders";
        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7; color: #333;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #ddd;">
              <h2 style="color: #e91e63;">New Order Received 🎉</h2>
        
              <p style="font-size: 16px;">Hello Team,</p>
              <p style="font-size: 16px;">
                We’ve received a new order from:
              </p>
        
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Name:</td>
                  <td style="padding: 8px;">${user.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Email:</td>
                  <td style="padding: 8px;">${user.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Mobile:</td>
                  <td style="padding: 8px;">${user.mobile}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Quantity:</td>
                  <td style="padding: 8px;">${quantity}</td>
                </tr>
              </table>
        
              <p style="font-size: 16px;">You can check and manage the order from our admin dashboard:</p>
              <p style="margin-top: 10px;">
                🔗 <a href="https://www.vrwonders.in/login.html" style="color: #00bcd4; text-decoration: none;">VR Wonders Admin Panel</a>
              </p>
        
              <br>
              <p style="font-size: 16px;">Best regards,<br>
              <strong>VR Wonders Team</strong></p>
            </div>
          </div>
        `;
        await sendMail("jinothedwin@gmail.com", subject, '', html);


        res.json({ success: true, message: "Order placed successfully.", order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error." });
    }
}

exports.getorders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).populate('userId');
        const result = orders.map(o => ({
            _id: o._id,
            quantity: o.quantity,
            status: o.status,
            image: o.image,
            createdAt: o.createdAt,
            name: o.userId?.name,
            email: o.userId?.email,
            mobile: o.userId?.mobile
        }));
        res.status(200).json({ success: true, orders: result });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
};



exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.status(200).json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Update failed' });
    }
};


exports.deleteOrder = async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Delete failed' });
    }
};

exports.neworder = async (req, res) => {

    var subject = "🎁 Thank You for Your Order – VR Wonders";
    var html = `
      <div style="font-family: Arial, sans-serif; background-color: #fdf6f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 25px 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h2 style="color: #e91e63; text-align: center;">🎉 Order Received!</h2>
    
          <p style="font-size: 16px; color: #333;">
            Hi <strong>${req.body.name}</strong>,
          </p>
    
          <p style="font-size: 16px; color: #333;">
            Thank you for placing an order with <strong>VR Wonders – Online Customized Gift Shop</strong>! 💝<br>
            We’ve received your request and our team will review the details shortly.
          </p>
    
          <h3 style="color: #d81b60; margin-top: 30px;">🧾 Your Order Summary:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #f8bbd0;"><strong>👤 Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #f8bbd0;">${req.body.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #f8bbd0;"><strong>📧 Email:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #f8bbd0;">${req.body.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #f8bbd0;"><strong>📱 Mobile:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #f8bbd0;">${req.body.mobile}</td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>💬 Message:</strong></td>
              <td style="padding: 8px;">${req.body.message}</td>
            </tr>
          </table>
    
          <p style="font-size: 16px; color: #333; margin-top: 25px;">
            Our team will contact you soon to confirm the details and proceed with customization.
          </p>
    
          <p style="font-size: 16px; color: #333;">
            If you have any questions or updates, feel free to reply to this email. ✉️
          </p>
    
          <br>
          <p style="font-size: 16px; color: #333;">
            With love,<br>
            <strong style="color: #e91e63;">VR Wonders Team</strong><br>
            🌐 <a href="https://www.vrwonders.in" style="color: #e91e63;">www.vrwonders.in</a><br>
            📩 <a href="mailto:vrwonders@gmail.com" style="color: #e91e63;">vrwonders@gmail.com</a>
          </p>
        </div>
      </div>
    `;
    
    await sendMail(req.body.email, subject, '', html);
    res.status(200).json({ success: true });
}