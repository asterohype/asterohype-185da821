-- Allow admins to delete any review
CREATE POLICY "Admins can delete any review"
ON public.product_reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));