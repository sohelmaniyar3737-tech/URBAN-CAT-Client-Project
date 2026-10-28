-- Add payment tracking for Razorpay. Existing orders remain unpaid and unchanged.
ALTER TABLE "Order" ADD COLUMN "paymentStatus" VARCHAR(30) NOT NULL DEFAULT 'unpaid';
ALTER TABLE "Order" ADD COLUMN "paymentMethod" VARCHAR(30) NOT NULL DEFAULT 'manual';
ALTER TABLE "Order" ADD COLUMN "razorpayOrderId" VARCHAR(80);
ALTER TABLE "Order" ADD COLUMN "razorpayPaymentId" VARCHAR(80);
CREATE UNIQUE INDEX "Order_razorpayOrderId_key" ON "Order"("razorpayOrderId");
CREATE UNIQUE INDEX "Order_razorpayPaymentId_key" ON "Order"("razorpayPaymentId");
