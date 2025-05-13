import NewsletterForm from "@/components/common/NewsletterForm";

const NewsletterSection = () => {
  return (
    <section className="py-16 bg-neutral-light">
      <div className="container mx-auto px-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 p-8 md:p-12">
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-3">Subscribe to Our Newsletter</h2>
              <p className="text-neutral-dark mb-6">Get the latest outdoor tips, gear reviews, and adventure ideas delivered to your inbox.</p>
              <NewsletterForm />
            </div>
            <div className="md:w-1/2 bg-primary relative h-64 md:h-auto">
              <img 
                src="https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Newsletter subscription" 
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8 text-center">
                <div className="font-accent text-3xl font-bold mb-2">Join Our Adventure Community</div>
                <p className="max-w-md">Connect with fellow outdoor enthusiasts, share your experiences, and discover new adventures!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
