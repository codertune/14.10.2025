import React from 'react';
import { Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react';

export default function PrivacyPageBn() {
  return (
    <div className="min-h-screen bg-gray-50 font-[SutonnyMJ]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                গোপনীয়তা নীতি
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              আপনার গোপনীয়তা এবং ডেটা নিরাপত্তা আমাদের সর্বোচ্চ অগ্রাধিকার। জানুন আমরা কীভাবে আপনার তথ্য সুরক্ষিত রাখি এবং পরিচালনা করি।
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>সর্বশেষ আপডেট: ২০ ডিসেম্বর, ২০২৪</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Eye className="h-6 w-6 text-blue-600 mr-3" />
            গোপনীয়তার সংক্ষিপ্ত ধারণা
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Lock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">এনক্রিপ্টেড প্রক্রিয়াকরণ</h3>
              <p className="text-sm text-gray-600">সমস্ত তথ্য প্রেরণ ও প্রক্রিয়াকরণের সময় এনক্রিপ্ট করা হয়</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Database className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">ডেটা সংরক্ষণ নয়</h3>
              <p className="text-sm text-gray-600">প্রক্রিয়াকরণের পরপরই ফাইল মুছে ফেলা হয়</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <UserCheck className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">GDPR অনুসারী</h3>
              <p className="text-sm text-gray-600">আন্তর্জাতিক গোপনীয়তা মানদণ্ডের পূর্ণ অনুসরণ করা হয়</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="h-6 w-6 text-blue-600 mr-3" />
            আমরা যে তথ্য সংগ্রহ করি
          </h2>

          <div className="prose prose-gray max-w-none text-gray-700">
            <h3>অ্যাকাউন্ট সম্পর্কিত তথ্য</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>অ্যাকাউন্ট তৈরির জন্য নাম ও ইমেল ঠিকানা</li>
              <li>প্রতিষ্ঠানের নাম ও যোগাযোগের তথ্য</li>
              <li>bKash-এর মাধ্যমে নিরাপদে প্রক্রিয়াকৃত পেমেন্ট তথ্য</li>
              <li>ব্যবহার পরিসংখ্যান ও পরিষেবা পছন্দ</li>
            </ul>

            <h3>ফাইল সম্পর্কিত তথ্য</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>প্রক্রিয়াকরণের জন্য আপলোড করা ডকুমেন্ট (PDF, Excel, CSV)</li>
              <li>ফাইলের আকার, ধরন ও প্রক্রিয়াকরণের প্রয়োজনীয়তা সম্পর্কিত মেটাডেটা</li>
              <li>গুণগত নিশ্চয়তা ও ডিবাগিংয়ের জন্য প্রক্রিয়াকরণ লগ</li>
            </ul>

            <h3>প্রযুক্তিগত তথ্য</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>IP ঠিকানা ও ব্রাউজার সম্পর্কিত তথ্য</li>
              <li>ডিভাইসের ধরন ও অপারেটিং সিস্টেম</li>
              <li>ব্যবহার প্যাটার্ন ও ফিচার ইন্টারঅ্যাকশন</li>
              <li>ত্রুটি লগ ও পারফরম্যান্স তথ্য</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">আমরা আপনার তথ্য কীভাবে ব্যবহার করি</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>পরিষেবা প্রদান:</strong> আপনার ডকুমেন্ট প্রক্রিয়াকরণ ও অটোমেশন পরিষেবা প্রদান</li>
            <li><strong>অ্যাকাউন্ট ব্যবস্থাপনা:</strong> আপনার অ্যাকাউন্ট রক্ষণাবেক্ষণ, পেমেন্ট প্রক্রিয়া ও সহায়তা প্রদান</li>
            <li><strong>পরিষেবা উন্নতি:</strong> ব্যবহারের ধরণ বিশ্লেষণ করে প্ল্যাটফর্ম উন্নত করা</li>
            <li><strong>যোগাযোগ:</strong> পরিষেবা আপডেট, নিরাপত্তা সতর্কতা ও সহায়তা বার্তা পাঠানো</li>
            <li><strong>নিয়ম মেনে চলা:</strong> আইনগত ও নিয়ন্ত্রক প্রয়োজনীয়তা পূরণ করা</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ডেটা নিরাপত্তা</h2>
          <div className="bg-blue-50 p-6 rounded-lg mb-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">আমাদের নিরাপত্তা ব্যবস্থা</h3>
            <ul className="list-disc pl-6 text-blue-800">
              <li>সমস্ত তথ্য প্রেরণে এন্ড-টু-এন্ড এনক্রিপশন</li>
              <li>আইসোলেটেড কন্টেইনারে নিরাপদ প্রক্রিয়াকরণ</li>
              <li>নিয়মিত নিরাপত্তা অডিট ও মূল্যায়ন</li>
              <li>অ্যাক্সেস নিয়ন্ত্রণ ও যাচাইকরণ ব্যবস্থা</li>
              <li>প্রক্রিয়াকরণ শেষে ফাইল স্বয়ংক্রিয়ভাবে মুছে ফেলা</li>
            </ul>
          </div>
          <p className="text-gray-600">
            আমরা শিল্পমান নিরাপত্তা ব্যবস্থা অনুসরণ করি যাতে আপনার ডেটা সুরক্ষিত থাকে। সমস্ত ফাইল নিরাপদ ও পৃথক পরিবেশে প্রক্রিয়াকৃত হয় এবং ২৪ ঘণ্টার মধ্যে স্থায়ীভাবে মুছে ফেলা হয়।
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ডেটা সংরক্ষণ</h2>
          <div className="bg-green-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">আমাদের সংরক্ষণ নীতি</h3>
            <ul className="list-disc pl-6 text-green-800">
              <li><strong>আপলোড করা ফাইল:</strong> প্রক্রিয়াকরণের পর সঙ্গে সঙ্গে মুছে ফেলা হয় (সর্বোচ্চ ২৪ ঘণ্টা)</li>
              <li><strong>প্রক্রিয়াকৃত ফলাফল:</strong> ৭ দিন পর্যন্ত ডাউনলোডের জন্য রাখা হয়, তারপর মুছে ফেলা হয়</li>
              <li><strong>অ্যাকাউন্ট তথ্য:</strong> অ্যাকাউন্ট সক্রিয় থাকা অবস্থায় সংরক্ষিত থাকে</li>
              <li><strong>পেমেন্ট রেকর্ড:</strong> আইনগত কারণে ৭ বছর পর্যন্ত সংরক্ষিত থাকে</li>
              <li><strong>ব্যবহার লগ:</strong> অজ্ঞাতনামা আকারে ৯০ দিন পর্যন্ত সংরক্ষিত থাকে</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">আপনার অধিকার</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>অ্যাক্সেস:</strong> আপনার ব্যক্তিগত তথ্যের কপি চাওয়ার অধিকার</li>
            <li><strong>সংশোধন:</strong> ভুল বা অসম্পূর্ণ তথ্য সংশোধনের অধিকার</li>
            <li><strong>মুছে ফেলা:</strong> আপনার ব্যক্তিগত তথ্য মুছে ফেলার অনুরোধ করার অধিকার</li>
            <li><strong>পোর্টেবিলিটি:</strong> তথ্য একটি কাঠামোবদ্ধ ফরম্যাটে পাওয়ার অধিকার</li>
            <li><strong>আপত্তি:</strong> তথ্য প্রক্রিয়াকরণে আপত্তি জানানোর অধিকার</li>
            <li><strong>সীমাবদ্ধতা:</strong> তথ্য প্রক্রিয়াকরণ সীমাবদ্ধ করার অনুরোধ করার অধিকার</li>
          </ul>
          <p className="text-gray-700">
            এই অধিকারগুলো ব্যবহার করতে আমাদের সাথে যোগাযোগ করুন:
            <a href="mailto:support@smartprocessflow.com" className="text-blue-600 hover:text-blue-800 ml-1">
              support@smartprocessflow.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">তৃতীয় পক্ষের পরিষেবা</h2>
          <ul className="list-disc pl-6 text-gray-700">
            <li><strong>bKash:</strong> পেমেন্ট প্রক্রিয়াকরণ (bKash-এর গোপনীয়তা নীতির আওতায়)</li>
            <li><strong>ক্লাউড অবকাঠামো:</strong> নিরাপদ হোস্টিং ও প্রক্রিয়াকরণ পরিষেবা</li>
            <li><strong>বিশ্লেষণ:</strong> পরিষেবা উন্নতির জন্য অজ্ঞাতনামা ব্যবহার বিশ্লেষণ</li>
            <li><strong>সহায়তা টুল:</strong> গ্রাহক সহায়তা ও যোগাযোগ ব্যবস্থা</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">আন্তর্জাতিক ডেটা স্থানান্তর</h2>
          <ul className="list-disc pl-6 text-gray-700">
            <li>ডেটা সুরক্ষার জন্য অনুমোদিত চুক্তিগত ধারা অনুসরণ</li>
            <li>সম্পর্কিত কর্তৃপক্ষের অনুমোদিত সুরক্ষা নীতি</li>
            <li>সার্টিফিকেশন স্কিম ও আচরণবিধি অনুসরণ</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">নীতিতে পরিবর্তন</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>আপনার নিবন্ধিত ইমেলে বিজ্ঞপ্তি পাঠানো হবে</li>
            <li>আমাদের ওয়েবসাইটে সুস্পষ্ট ঘোষণা দেওয়া হবে</li>
            <li>পরিষেবা ব্যবহারের সময় ইন-অ্যাপ নোটিফিকেশন দেওয়া হবে</li>
          </ul>
          <p className="text-gray-700">
            পরিবর্তনের পর পরিষেবা ব্যবহার চালিয়ে গেলে তা আপডেট করা নীতির প্রতি আপনার সম্মতি হিসেবে গণ্য হবে।
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">যোগাযোগ করুন</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p><strong>ইমেইল:</strong> support@smartprocessflow.com</p>
            <p><strong>ফোন:</strong> +880 1947 214525</p>
            <p><strong>ঠিকানা:</strong> ঢাকা, বাংলাদেশ</p>
          </div>
        </section>
      </div>
    </div>
  );
}
